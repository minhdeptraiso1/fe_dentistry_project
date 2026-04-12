import request from "@/utils/request";
import type {
  PublicContent,
  PublicContentSummary,
  PublicContentType,
} from "@/types/publicContent";

export const publicWebsiteApi = {
  getList(type: PublicContentType, featured?: boolean) {
    return request.get<PublicContentSummary[]>("/public-contents", {
      params: { type, featured },
    });
  },

  getDetailById(id: string) {
    return request.get<PublicContent>(`/public-contents/${id}`);
  },

  getDetailBySlug(slug: string) {
    return request.get<PublicContent>(`/public-contents/slug/${slug}`);
  },
};
