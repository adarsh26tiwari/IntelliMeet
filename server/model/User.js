import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';


const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,'Please provide a name'],
        trim:true,
        maxlength:[50,'Name cannot be more than 50 characters']
    },
    email:{
        type:String,
        required:[true,'Please provide an email'],
        trim:true,
        unique:true,
        lowercase:true,
        match: [
          /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
          'Please provide a valid email'
        ]
    },
    password:{
        type:String,
        required:[true,'Please provide a password'],
        minlength:[6,'Password must be at least 6 characters'],
        select:false,
    },
    // Feature 1: Stores bcrypt hash of the refresh token.
    // Hashed (not plaintext) for security — if DB is breached, tokens can't be replayed.
    refreshTokenHash: {
        type: String,
        select: false, // Never returned in queries by default
        default: null,
    },
},{
    timestamps:true
})


// Hash password before saving to database
userSchema.pre('save', async function() {
    if(!this.isModified('password')){
        return;
    }
    const salt = await bcryptjs.genSalt(12);
    this.password = await bcryptjs.hash(this.password, salt);
})

userSchema.methods.matchPassword = async function(enteredPassword){
    return await bcryptjs.compare(enteredPassword,this.password);
}

export default mongoose.model('User', userSchema)