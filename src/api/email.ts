import request from "@/utils/request";

export interface SendTemplateEmailRequest {
  to: string;
  subject: string;
  template: string;
  model?: Record<string, any>;
}

export const emailApi = {
  sendTemplate(data: SendTemplateEmailRequest) {
    return request.post<{ success: boolean; message: string }>(
      "/emails/send-template",
      data,
    );
  },
};
