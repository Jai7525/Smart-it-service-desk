from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
import uuid
from pydantic import BaseModel
from datetime import datetime

from smart_ticket.core.database import get_session
from smart_ticket.core.security import get_current_user, require_roles
from smart_ticket.models import KnowledgeArticle, Profile, UserRole, IncidentCategory

router = APIRouter(prefix="/knowledge-base", tags=["Knowledge Base"])


class ArticleCreate(BaseModel):
    title: str
    content: str
    category: IncidentCategory
    is_published: bool = True


class ArticleRead(BaseModel):
    id: uuid.UUID
    title: str
    content: str
    category: IncidentCategory
    author_id: uuid.UUID
    is_published: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.get("/", response_model=List[ArticleRead])
def search_knowledge_articles(
    category: Optional[IncidentCategory] = None,
    query: Optional[str] = None,
    session: Session = Depends(get_session)
):
    """
    SRS FR-17: Searchable troubleshooting articles for employees and agents.
    """
    stmt = select(KnowledgeArticle).where(KnowledgeArticle.is_published == True)
    if category:
        stmt = stmt.where(KnowledgeArticle.category == category)
    
    articles = session.exec(stmt.order_by(KnowledgeArticle.created_at.desc())).all()

    if query:
        q = query.lower()
        articles = [
            a for a in articles 
            if q in a.title.lower() or q in a.content.lower()
        ]

    return articles


@router.post("/", response_model=ArticleRead, status_code=status.HTTP_201_CREATED)
def create_knowledge_article(
    article_in: ArticleCreate,
    current_user: Profile = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT])),
    session: Session = Depends(get_session)
):
    """
    Create a new troubleshooting article (Agents, Managers, Admins).
    """
    article = KnowledgeArticle(
        title=article_in.title,
        content=article_in.content,
        category=article_in.category,
        author_id=current_user.id,
        is_published=article_in.is_published
    )
    session.add(article)
    session.commit()
    session.refresh(article)
    return article

