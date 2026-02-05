import type { GetEmailResponseSuccess } from "resend";

export type ListEmail = Omit<
  GetEmailResponseSuccess,
  'html' | 'text' | 'tags' | 'object'
>;

export interface ListEmailsResponseSuccess {
  object: 'list';
  has_more: boolean;
  data: ListEmail[];
}
