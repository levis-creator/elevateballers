import type { PrismaClient } from '@prisma/client';
import type {
  CreateSiteSettingInput,
  SiteSetting,
  SiteSettingsRepository,
  UpdateSiteSettingInput,
} from '../domain/siteSetting';

type PrismaSiteSetting = Awaited<ReturnType<PrismaClient['siteSetting']['findFirst']>>;

function toDomain(setting: PrismaSiteSetting): SiteSetting | null {
  return setting ? { ...setting } : null;
}

export class PrismaSiteSettingsRepository implements SiteSettingsRepository {
  constructor(private readonly database: PrismaClient) {}

  async findAll(category?: string): Promise<SiteSetting[]> {
    return this.database.siteSetting.findMany({
      where: category ? { category } : {},
      orderBy: { category: 'asc' },
    });
  }

  async findById(id: string): Promise<SiteSetting | null> {
    return toDomain(await this.database.siteSetting.findUnique({ where: { id } }));
  }

  async findByKey(key: string): Promise<SiteSetting | null> {
    return toDomain(await this.database.siteSetting.findUnique({ where: { key } }));
  }

  async create(input: CreateSiteSettingInput): Promise<SiteSetting> {
    return this.database.siteSetting.create({ data: input });
  }

  async update(id: string, input: UpdateSiteSettingInput): Promise<SiteSetting | null> {
    try {
      return await this.database.siteSetting.update({ where: { id }, data: input });
    } catch (error: unknown) {
      if (this.isNotFoundError(error)) return null;
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.database.siteSetting.delete({ where: { id } });
      return true;
    } catch (error: unknown) {
      if (this.isNotFoundError(error)) return false;
      throw error;
    }
  }

  private isNotFoundError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025';
  }
}
