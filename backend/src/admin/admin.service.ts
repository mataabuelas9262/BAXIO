import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ReportStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private requireStaff(role: Role) {
    if (role !== Role.ADMIN && role !== Role.MODERATOR) {
      throw new ForbiddenException('Esta sección es exclusiva para administración.');
    }
  }

  async listReports(role: Role, status?: ReportStatus) {
    this.requireStaff(role);
    return this.prisma.messageReport.findMany({
      where: status ? { status } : undefined,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 100,
      select: {
        id: true, reason: true, details: true, status: true, createdAt: true,
        reporter: { select: { id: true, fullName: true, email: true } },
        reportedUser: { select: { id: true, fullName: true, email: true } },
        message: { select: { id: true, content: true, createdAt: true, sender: { select: { id: true, fullName: true } } } },
      },
    });
  }

  async updateReport(role: Role, id: string, status: ReportStatus) {
    this.requireStaff(role);
    const changed = await this.prisma.messageReport.updateMany({ where: { id }, data: { status } });
    if (changed.count !== 1) throw new NotFoundException('Reporte no encontrado.');
    return this.prisma.messageReport.findUniqueOrThrow({
      where: { id },
      select: { id: true, status: true, reason: true, createdAt: true },
    });
  }
}
