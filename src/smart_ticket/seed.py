"""
Database Seeding Script (PRD & SRS standard baseline data)
Populates initial:
- Departments (IT, HR, Engineering)
- Support Teams (Network Operations, Hardware Support, Software Support, Access & IAM)
- Default Profiles (Admin, Manager, Network Agent, Hardware Agent, Employees)
- Team Memberships
- Default SLA Policies
- Default Workflow Automation Rules
"""
import uuid
from sqlmodel import Session, select
from smart_ticket.core.database import engine, init_db
from smart_ticket.models import (
    Department, SupportTeam, Profile, TeamMember, SLAPolicy, AutomationRule,
    UserRole, IncidentCategory, PriorityLevel
)


def seed_data():
    init_db()
    with Session(engine) as session:
        # 1. Departments
        dept_it = session.exec(select(Department).where(Department.name == "Information Technology")).first()
        if not dept_it:
            dept_it = Department(name="Information Technology", description="Corporate IT Operations")
            dept_hr = Department(name="Human Resources", description="HR Department")
            dept_eng = Department(name="Engineering", description="Software Engineering & Dev")
            session.add_all([dept_it, dept_hr, dept_eng])
            session.commit()
            session.refresh(dept_it)

        # 2. Support Teams mapped to Categories
        teams_data = [
            ("Network Operations", IncidentCategory.NETWORK, "Handles VPN, Wi-Fi, LAN, routers, and connectivity"),
            ("Hardware Support", IncidentCategory.HARDWARE, "Handles laptops, monitors, accessories, peripherals"),
            ("Application Support", IncidentCategory.SOFTWARE, "Handles OS, software suites, office tools, and crashing apps"),
            ("Identity & Access Team", IncidentCategory.ACCESS, "Handles SSO, passwords, 2FA, accounts, and directory access"),
            ("General Service Desk", IncidentCategory.GENERAL, "General triage and unclassified issues")
        ]
        created_teams = {}
        for name, cat, desc in teams_data:
            team = session.exec(select(SupportTeam).where(SupportTeam.name == name)).first()
            if not team:
                team = SupportTeam(name=name, category=cat, description=desc)
                session.add(team)
                session.commit()
                session.refresh(team)
            created_teams[cat] = team

        # 3. User Profiles
        users_data = [
            ("admin@smartticket.local", "System Administrator", UserRole.ADMIN),
            ("manager@smartticket.local", "Sarah Connor (IT Manager)", UserRole.MANAGER),
            ("agent.network@smartticket.local", "Alex Rivers (Network Agent)", UserRole.AGENT),
            ("agent.hardware@smartticket.local", "Devon Vance (Hardware Agent)", UserRole.AGENT),
            ("employee.john@smartticket.local", "John Doe (Employee)", UserRole.EMPLOYEE),
        ]
        created_users = {}
        for email, full_name, role in users_data:
            user = session.exec(select(Profile).where(Profile.email == email)).first()
            if not user:
                user = Profile(
                    email=email,
                    full_name=full_name,
                    role=role,
                    department_id=dept_it.id,
                    is_active=True,
                    is_available=True
                )
                session.add(user)
                session.commit()
                session.refresh(user)
            created_users[email] = user

        # 4. Team Memberships
        net_agent = created_users.get("agent.network@smartticket.local")
        net_team = created_teams.get(IncidentCategory.NETWORK)
        if net_agent and net_team:
            existing_tm = session.exec(
                select(TeamMember).where(TeamMember.team_id == net_team.id, TeamMember.agent_id == net_agent.id)
            ).first()
            if not existing_tm:
                session.add(TeamMember(team_id=net_team.id, agent_id=net_agent.id))

        hw_agent = created_users.get("agent.hardware@smartticket.local")
        hw_team = created_teams.get(IncidentCategory.HARDWARE)
        if hw_agent and hw_team:
            existing_tm = session.exec(
                select(TeamMember).where(TeamMember.team_id == hw_team.id, TeamMember.agent_id == hw_agent.id)
            ).first()
            if not existing_tm:
                session.add(TeamMember(team_id=hw_team.id, agent_id=hw_agent.id))

        # 5. SLA Policies
        sla_defaults = [
            (PriorityLevel.CRITICAL, 0.5, 2.0),
            (PriorityLevel.HIGH, 1.0, 4.0),
            (PriorityLevel.MEDIUM, 4.0, 24.0),
            (PriorityLevel.LOW, 8.0, 48.0),
        ]
        for prio, resp_h, res_h in sla_defaults:
            policy = session.exec(select(SLAPolicy).where(SLAPolicy.priority == prio)).first()
            if not policy:
                session.add(SLAPolicy(
                    priority=prio,
                    response_time_hours=resp_h,
                    resolution_time_hours=res_h,
                    warning_threshold_percentage=0.75
                ))

        # 6. Default Automation Rules (PRD 5.6)
        rule_critical = session.exec(
            select(AutomationRule).where(AutomationRule.name == "Auto-Alert on Critical Incident")
        ).first()
        if not rule_critical:
            session.add(AutomationRule(
                name="Auto-Alert on Critical Incident",
                description="Immediately notifies IT Managers whenever a Critical priority ticket is submitted",
                trigger="ticket_created",
                conditions={"priority": "critical"},
                actions=[
                    {"type": "notify_manager", "message": "High business impact incident reported! Attention required."}
                ],
                is_active=True
            ))

        session.commit()
        print(">> Database seeded successfully with standard teams, agents, SLAs, and automation rules.")


if __name__ == "__main__":
    seed_data()

