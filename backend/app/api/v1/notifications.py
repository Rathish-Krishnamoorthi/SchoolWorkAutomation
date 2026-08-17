from fastapi import APIRouter
from typing import List
from app.models.models import Notification
from app.schemas.schemas import NotificationOut

router = APIRouter()


@router.get("/", response_model=List[NotificationOut])
async def list_notifications():
    notifications = await Notification.find().sort(-Notification.created_at).limit(50).to_list()
    return [_notif_out(n) for n in notifications]


@router.patch("/{notification_id}/read")
async def mark_read(notification_id: str):
    n = await Notification.get(notification_id)
    if n:
        await n.set({"read": True})
    return {"ok": True}


@router.patch("/mark-all-read")
async def mark_all_read():
    await Notification.find(Notification.read == False).update({"$set": {"read": True}})
    return {"ok": True}


def _notif_out(n: Notification) -> dict:
    return {
        "id": str(n.id),
        "title": n.title,
        "message": n.message,
        "type": n.type,
        "severity": n.severity,
        "read": n.read,
        "created_at": n.created_at,
        "action_label": n.action_label,
        "action_route": n.action_route,
    }
