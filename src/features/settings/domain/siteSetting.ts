export type SiteSetting = {
  id: string;
  key: string;
  value: string;
  type: string;
  label: string;
  description: string | null;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateSiteSettingInput = {
  key: string;
  value: string;
  type?: string;
  label: string;
  description?: string;
  category?: string;
};

export type UpdateSiteSettingInput = Partial<Omit<CreateSiteSettingInput, 'key'>>;

export interface SiteSettingsRepository {
  findAll(category?: string): Promise<SiteSetting[]>;
  findById(id: string): Promise<SiteSetting | null>;
  findByKey(key: string): Promise<SiteSetting | null>;
  create(input: CreateSiteSettingInput): Promise<SiteSetting>;
  update(id: string, input: UpdateSiteSettingInput): Promise<SiteSetting | null>;
  delete(id: string): Promise<boolean>;
}
