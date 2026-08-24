import * as repository from "@/features/staff/data/datasources/staff-repository";
import { staffBulkDeleteSchema, staffMutationSchema, staffTransferSchema, staffUpdateSchema } from "@/features/staff/domain/entities/staff-management";

export const listStaff = repository.listStaff;
export const getStaff = (id: string) => repository.findStaff(id);
export const createStaff = (input: unknown) => repository.createStaff(staffMutationSchema.parse(input));
export const updateStaff = (id: string, input: unknown) => repository.updateStaff(id, staffUpdateSchema.parse(input));
export const deleteStaff = (id: string) => repository.removeStaff(id);
export const bulkDeleteStaff = (input: unknown) => repository.bulkRemoveStaff(staffBulkDeleteSchema.parse(input).ids);
export const getStaffAssignmentHistory = (staffId: string) => repository.listStaffAssignmentHistory(staffId);
export const getStaffTransferHistory = (staffId: string) => repository.listStaffTransfers(staffId);
export const transferStaff = (staffId: string, input: unknown, actorUserId: string) => repository.transferStaff(staffId, staffTransferSchema.parse(input), actorUserId);
