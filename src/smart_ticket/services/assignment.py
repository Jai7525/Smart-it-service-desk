import uuid
from typing import Optional, Tuple
from sqlmodel import Session, select, func
from smart_ticket.core.config import settings
from smart_ticket.models import (
    IncidentCategory, SupportTeam, TeamMember, Profile, Incident, TicketStatus, UserRole
)


class AssignmentEngine:
    @staticmethod
    def assign_ticket(
        session: Session,
        category: IncidentCategory
    ) -> Tuple[Optional[uuid.UUID], Optional[uuid.UUID]]:
        """
        Phase 1 & Phase 2 Assignment Engine:
        - Strict Role Restriction: ONLY users with UserRole.AGENT ('agent') are eligible.
        - NEVER assign to UserRole.MANAGER, UserRole.EMPLOYEE, or UserRole.ADMIN.
        - Category Matching: Matches category with configured SupportTeam.
        - Fallback: Defaults to General Service Desk team if category not found.
        - Intelligent Workload Balancing:
            - Checks Profile.is_active == True and Profile.is_available == True.
            - Computes active ticket workload (OPEN and IN_PROGRESS).
            - Enforces MAX_ACTIVE_TICKETS_PER_AGENT capacity constraint.
            - Lowest-workload selection with deterministic tie-breaking (created_at asc).
        - If all agents are unavailable or at max capacity, returns (team.id, None) so
          ticket remains unassigned and triggers IT Manager notification.
        """
        # 1. Match Support Team by category
        team = session.exec(
            select(SupportTeam).where(SupportTeam.category == category)
        ).first()

        # Fallback to General Support Team if not found
        if not team:
            team = session.exec(
                select(SupportTeam).where(SupportTeam.category == IncidentCategory.GENERAL)
            ).first()

        # If still no team, fallback to first available support team
        if not team:
            team = session.exec(select(SupportTeam)).first()

        if not team:
            return None, None

        # 2. Find eligible agents in this team who are strictly UserRole.AGENT, active, and available
        team_agents = session.exec(
            select(Profile)
            .join(TeamMember, TeamMember.agent_id == Profile.id)
            .where(
                TeamMember.team_id == team.id,
                Profile.is_active == True,
                Profile.is_available == True,
                Profile.role == UserRole.AGENT  # STRICTLY AGENT ONLY
            )
        ).all()

        # If no agent in this specific team, check fallback general support team agents
        if not team_agents and team.category != IncidentCategory.GENERAL:
            general_team = session.exec(
                select(SupportTeam).where(SupportTeam.category == IncidentCategory.GENERAL)
            ).first()
            if general_team:
                team_agents = session.exec(
                    select(Profile)
                    .join(TeamMember, TeamMember.agent_id == Profile.id)
                    .where(
                        TeamMember.team_id == general_team.id,
                        Profile.is_active == True,
                        Profile.is_available == True,
                        Profile.role == UserRole.AGENT
                    )
                ).all()
                if team_agents:
                    team = general_team

        # If still no eligible agents available
        if not team_agents:
            return team.id, None

        # 3. Intelligent Workload Balancing (Phase 2):
        # Calculate active workload (OPEN or IN_PROGRESS) among eligible agents.
        # Enforce maximum workload capacity and deterministic tie-breaking.
        eligible_candidates = []
        max_capacity = getattr(settings, "MAX_ACTIVE_TICKETS_PER_AGENT", 5)

        for agent in team_agents:
            # Double check role safeguard
            if agent.role != UserRole.AGENT or not agent.is_active or not agent.is_available:
                continue

            active_count = session.exec(
                select(func.count(Incident.id)).where(
                    Incident.assigned_agent_id == agent.id,
                    Incident.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS])
                )
            ).one()

            # Capacity filter: skip agents who reached max workload capacity
            if active_count < max_capacity:
                # Store (workload, agent.created_at, agent) for deterministic tie-breaking
                eligible_candidates.append((active_count, agent.created_at, agent))

        if not eligible_candidates:
            # All eligible agents in the team are at full capacity
            return team.id, None

        # Sort by workload ascending; tie-break by agent seniority (created_at ascending)
        eligible_candidates.sort(key=lambda item: (item[0], item[1]))
        least_loaded_agent = eligible_candidates[0][2]

        return team.id, least_loaded_agent.id
