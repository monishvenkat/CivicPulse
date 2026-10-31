import jwt from 'jsonwebtoken';
import { User } from './models.js';
export const cookieName='civic_session';
export function issueSession(res,user){
  const token=jwt.sign({sub:user.id},process.env.JWT_SECRET,{expiresIn:'12h'});
  res.cookie(cookieName,token,{httpOnly:true,sameSite:process.env.COOKIE_SECURE==='true'?'none':'lax',secure:process.env.COOKIE_SECURE==='true',maxAge:12*60*60*1000,path:'/'});
}
export async function authenticate(req,res,next){
  try { const token=req.cookies?.[cookieName]; if(!token) return res.status(401).json({error:'Sign in to continue.'});
    const {sub}=jwt.verify(token,process.env.JWT_SECRET); const user=await User.findById(sub);
    if(!user||!user.active) return res.status(401).json({error:'Your session is no longer valid. Please sign in again.'}); req.user=user; next();
  } catch { return res.status(401).json({error:'Your session has expired. Please sign in again.'}); }
}
export const allow=(...roles)=>(req,res,next)=>roles.includes(req.user?.role)?next():res.status(403).json({error:'You do not have permission to perform this action.'});
