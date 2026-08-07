import {
  entity,
  role,
  text,
  boolean,
  int,
  uuid,
} from '@microsoft/rayfin-core';

@entity()
@role('authenticated', '*')
export class Zcommand {
  @uuid() id!: string;
  @text() menu_id!: string;
  @text() menu_id0?: string;
  @text() bar?: string;
  @text() bar2?: string;
  @text() description?: string;
  @text() description2?: string;
  @text() type?: string;
  @text() exe?: string;
  @text() img?: string;
  @text() sysid?: string;
  @text() rep_form?: string;
  @text() syscode?: string;
  @int() hide_yn?: number;
  @text() vc_active?: string;
  @boolean() smsys?: boolean;
  @text() tool_type?: string;
  @boolean() print_yn?: boolean;
  @boolean() web_yn?: boolean;
  @text() country_code?: string;
  @boolean() note_yn?: boolean;
  @text() forder?: string;
}

