export interface BootstrapResponse {
    milestones: MilestoneDto[];
    categories: CategoryDto[];
    settings: SettingDto[];
    mediaFiles: MediaFileDto[];
}

export interface MigrationStatusDto {
    completed: boolean;
}

export interface MilestoneDto {
    id: string;
    title: string;
    date: string;
    datePrecision: string;
    direction: string;
    categoryId: string;
    color: string;
    note: string;
    url: string;
    recurrence: string | null;
    recurrenceId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CategoryDto {
    id: string;
    label: string;
    color: string;
    createdAt: string;
    updatedAt: string;
}

export interface SettingDto {
    key: string;
    value: string;
    updatedAt: string;
}

export interface MediaFileDto {
    id: string;
    milestoneId: string;
    kind: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    storagePath: string;
    sha256: string;
    createdAt: string;
}

export interface BackupMediaFileDto extends MediaFileDto {
    dataBase64: string;
}

export interface BackupBundleDto {
    version: string;
    exportedAt: string;
    milestones: MilestoneDto[];
    categories: CategoryDto[];
    settings: SettingDto[];
    mediaFiles: BackupMediaFileDto[];
}

export interface UpsertMilestoneBody {
    title: string;
    date: string;
    datePrecision: string;
    direction: string;
    categoryId: string;
    color: string;
    note?: string;
    url?: string;
    recurrence?: string | null;
    recurrenceId?: string | null;
}

export interface RestoreMilestoneBody extends UpsertMilestoneBody {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CategoryInput {
    id: string;
    label: string;
    color: string;
}

export interface SettingInput {
    key: string;
    value: string;
}

export interface MediaImportInput {
    milestoneId: string;
    kind: string;
    originalName: string;
    mimeType: string;
    dataBase64: string;
}

export interface BrowserLocalImportBody {
    milestones: RestoreMilestoneBody[];
    categories: CategoryInput[];
    settings: SettingInput[];
    mediaFiles: MediaImportInput[];
}

export interface BackupRestoreBody {
    version: string;
    exportedAt: string;
    milestones: RestoreMilestoneBody[];
    categories: CategoryInput[];
    settings: SettingInput[];
    mediaFiles: Array<MediaImportInput & { id?: string; createdAt?: string }>;
}
