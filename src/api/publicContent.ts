import request from "@/utils/request";
import type {
  CreatePublicContentRequest,
  PublicContent,
  PublicContentSearchRequest,
  PublicContentSummary,
  UpdatePublicContentRequest,
} from "@/types/publicContent";
import type { PageResponse } from "@/types";

export const publicContentApi = {
  search(params: PublicContentSearchRequest) {
    return request.get<PageResponse<PublicContentSummary>>(
      "/admin/public-contents",
      { params },
    );
  },

  getById(id: string) {
    return request.get<PublicContent>(`/admin/public-contents/${id}`);
  },

  create(data: CreatePublicContentRequest) {
    return request.post<PublicContent>("/admin/public-contents", data);
  },

  update(id: string, data: UpdatePublicContentRequest) {
    return request.put<PublicContent>(`/admin/public-contents/${id}`, data);
  },

  delete(id: string) {
    return request.delete<void>(`/admin/public-contents/${id}`);
  },
};
