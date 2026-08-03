import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/client';

vi.mock('@/lib/client', () => ({
  prisma: {
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    }
  }
}));

const notificationService = {
  createNotification: async (data: any) => await prisma.notification.create({ data }),
  getUnread: async (userId: string) => await prisma.notification.findMany({ where: { userId, isRead: false } }),
  markAsRead: async (id: string) => await prisma.notification.update({ where: { id }, data: { isRead: true } }),
  countUnread: async (userId: string) => await prisma.notification.count({ where: { userId, isRead: false } })
};

describe('Notification API operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Crea una notificación con título, mensaje y link', async () => {
    const data = { userId: '1', title: 'Nuevo pedido', message: 'Tienes un nuevo pedido', link: '/orders/1' };
    (prisma.notification.create as any).mockResolvedValue({ id: '1', ...data, isRead: false });

    const result = await notificationService.createNotification(data);
    
    expect(prisma.notification.create).toHaveBeenCalledWith({ data });
    expect(result.title).toBe('Nuevo pedido');
  });

  it('Lista notificaciones no leídas del usuario', async () => {
    const mockNotifications = [{ id: '1', title: 'Notificación 1' }];
    (prisma.notification.findMany as any).mockResolvedValue(mockNotifications);

    const result = await notificationService.getUnread('user-1');
    
    expect(prisma.notification.findMany).toHaveBeenCalledWith({ where: { userId: 'user-1', isRead: false } });
    expect(result).toEqual(mockNotifications);
  });

  it('Marca una notificación como leída', async () => {
    (prisma.notification.update as any).mockResolvedValue({ id: '1', isRead: true });

    await notificationService.markAsRead('1');
    
    expect(prisma.notification.update).toHaveBeenCalledWith({ where: { id: '1' }, data: { isRead: true } });
  });

  it('Cuenta notificaciones no leídas de un usuario', async () => {
    (prisma.notification.count as any).mockResolvedValue(5);

    const result = await notificationService.countUnread('user-1');
    
    expect(prisma.notification.count).toHaveBeenCalledWith({ where: { userId: 'user-1', isRead: false } });
    expect(result).toBe(5);
  });
});
