import { verifyToken } from "../utils/jwt.js";



export const protect = async(req,res,next) => {
    try {
        let token;
        if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
            token = req.headers.authorization.split(' ')[1]; //extract token part 
        }

        if(!token){
            return res.status(401).json({
                success:false,
                error:'Not authorized, no token provide'
            })
        }

        try {
             const decode = verifyToken(token);
             req.user = decode;
             next();
        } catch (error) {
                  return res.status(401).json({
                success:false,
                error:'Not authorized, invalid token'
            })
        }
    } catch (error) {
        next(error)
    }
}