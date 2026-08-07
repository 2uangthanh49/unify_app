import { getRayfinClient } from './rayfinClient';

export interface ZcommandItem {
  id: string;
  menu_id: string;
  menu_id0?: string;
  bar?: string;
  bar2?: string;
  description?: string;
  description2?: string;
  type?: string;
  exe?: string;
  img?: string;
  sysid?: string;
  rep_form?: string;
  syscode?: string;
  hide_yn?: number;
  vc_active?: string;
  smsys?: boolean;
  tool_type?: string;
  print_yn?: boolean;
  web_yn?: boolean;
  country_code?: string;
  note_yn?: boolean;
  forder?: string;
}


export async function getZcommands(): Promise<ZcommandItem[]> {
  const client = getRayfinClient();
  console.log('%c[Test Get] Fetching zscommand from Rayfin Database...', 'color: #ff8c00; font-weight: bold;');
  try {
    const results = await client.data.Zcommand.select([

      'menu_id',
      'menu_id0',
      'bar',
      'bar2',
      'description',
      'description2',
      'type',
      'exe',
      'img',
      'sysid',
      'rep_form',
      'syscode',
      'hide_yn',
      'vc_active',
      'smsys',
      'tool_type',
      'print_yn',
      'web_yn',
      'country_code',
      'note_yn',
      'forder',
    ])
      .orderBy({ menu_id: 'asc' })
      .execute();

    console.log('l%c[Test Gett] Fetch success! Total items:', 'color: #008000; font-weight: bold;', results?.length);
    if (results && results.length > 0) {
      console.log('[Test Gett] First 3 items:', results.slice(0, 3));
    } else {
      console.log('[Test Gett] Result is empty.');
    }
    return results as ZcommandItem[];
  } catch (error) {
    console.error('%c[Test Gett] Fetch failed with error:', 'color: #ff0000; font-weight: bold;', error);
    throw error;
  }
}

