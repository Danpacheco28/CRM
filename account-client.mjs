export const ROLES={admin:'Administrador',member:'Colaborador'};
export function publicConnection(config){
  if(!config.supabaseUrl&&!config.publishableKey)return false;
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(config.supabaseUrl||''))throw Error('Configure a URL HTTPS do projeto Supabase.');
  const key=config.publishableKey||'';
  if(key.startsWith('sb_secret_'))throw Error('A chave secreta não pode ser usada no navegador. Use a chave publicável.');
  if(key.startsWith('eyJ')){let payload;try{payload=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));}catch{throw Error('Chave pública inválida.');}if(payload.role!=='anon')throw Error('Use somente a chave anon pública ou publicável.');}
  else if(!key.startsWith('sb_publishable_'))throw Error('Informe a chave publicável do projeto.');
  return true;
}
export function userInput(input,creating=false){
  const name=String(input.name||'').trim(),email=String(input.email||'').trim().toLowerCase(),role=input.role;
  if(name.length<2||name.length>100)throw Error('Informe um nome de 2 a 100 caracteres.');
  if(!Object.hasOwn(ROLES,role))throw Error('Perfil inválido.');
  if(creating&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Informe um email válido.');
  if(creating&&(typeof input.password!=='string'||input.password.length<12||input.password.length>128))throw Error('Use uma senha inicial com 12 a 128 caracteres.');
  return {name,email,role,...(creating?{password:input.password}:{})};
}
export class InternalAccess{
  constructor(client){this.client=client;this.profile=null;this.users=[];}
  async call(action,values={}){
    const {data,error}=await this.client.functions.invoke('crm-internal',{body:{action,...values}});
    if(error){let message='Não foi possível concluir a operação. Confira a conexão e tente novamente.';try{const body=await error.context?.json();message=body?.error||message;}catch{}throw Error(message);}
    if(data?.error)throw Error(data.error);return data;
  }
  async session(){const {data,error}=await this.client.auth.getSession();if(error)throw error;return data.session;}
  async login(email,password){const {error}=await this.client.auth.signInWithPassword({email:email.trim(),password});if(error)throw Error('Email ou senha inválidos, ou acesso indisponível.');return this.me();}
  async me(){const result=await this.call('me');this.profile=result.profile;return this.profile;}
  async list(){const result=await this.call('listUsers');this.users=result.users;return this.users;}
  async create(values){const input=userInput(values,true);await this.call('createUser',input);return this.list();}
  async update(id,values){const input=userInput(values);await this.call('updateUser',{id,...input,active:values.active});return this.list();}
  async remove(id){await this.call('deleteUser',{id});return this.list();}
  async password(current,password){if(password.length<12||password.length>128)throw Error('Use uma senha com 12 a 128 caracteres.');const {error:reauth}=await this.client.auth.signInWithPassword({email:this.profile.email,password:current});if(reauth)throw Error('A senha atual está incorreta.');const {error}=await this.client.auth.updateUser({password});if(error)throw Error('Não foi possível alterar a senha. Confira a política de senhas do projeto.');await this.call('passwordChanged');return this.me();}
  async logout(){const {error}=await this.client.auth.signOut({scope:'local'});if(error)throw error;this.profile=null;this.users=[];}
}
export async function connectInternal(config,factory){
  if(!publicConnection(config))return null;
  const createClient=factory||(await import('https://esm.sh/@supabase/supabase-js@2.57.4?bundle')).createClient;
  return new InternalAccess(createClient(config.supabaseUrl,config.publishableKey,{auth:{storage:sessionStorage,persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}));
}
