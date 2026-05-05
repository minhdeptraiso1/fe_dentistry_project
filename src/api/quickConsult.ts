import request from "@/utils/request";

export interface QuickConsultRequest {
  message: string;
  conversation?: ChatMessage[];
}

export interface ChatMessage {
  role: "USER" | "ASSISTANT" | "DOCTOR";
  content: string;
}

export interface QuickConsultResponse {
  reply: string;
  suggestedServices: QuickConsultService[];
  suggestedDoctors: QuickConsultDoctor[];
  needMoreInfo: boolean;
  nextQuestion: string | null;
  disclaimer: string;
}

export interface QuickConsultService {
  serviceId?: string;
  serviceClass?: string;
  id?: string;
  code?: string;
  title?: string;
  tittle?: string;
  name?: string;
  description?: string;
  reason?: string;
  estimatedPrice?: number;
}

export interface QuickConsultDoctor {
  doctorId?: string;
  id?: string;
  name?: string;
  doctorName?: string;
  fullName?: string;
  specialization?: string;
  experience?: number;
  avatar?: string;
}

export const quickConsultApi = {
  /**
   * Quick dental consultation - get service and doctor recommendations
   * POST /quick-consult
   */
  consult(request: QuickConsultRequest) {
    return requestObj.post<QuickConsultResponse>("/quick-consult", request);
  },
};

// Workaround to avoid naming conflict with request utility
const requestObj = request;
