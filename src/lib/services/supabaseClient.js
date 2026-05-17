import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

// 사용자가 .env에 선언한 변수명을 사용합니다.
// 만약 SUPABASE_DB_URL이 API URL(프로젝트 URL)이 아니라면 오류가 발생할 수 있습니다.
const supabaseUrl = env.SUPABASE_DB_URL;
const supabaseAnonKey = env.SUPABASE_DE_PULBIC_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
