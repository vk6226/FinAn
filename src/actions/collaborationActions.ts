'use server'

import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function sendCollaborationMessage(reportId: string, userId: string, text: string, role: string) {
  try {
    await db.collaborationMessage.create({
      data: {
        reportId,
        userId,
        text,
        role
      }
    });
    revalidatePath('/banker');
    revalidatePath('/analyst');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getCollaborationMessages(reportId: string) {
  return await db.collaborationMessage.findMany({
    where: { reportId },
    include: { user: true },
    orderBy: { createdAt: 'asc' }
  });
}
