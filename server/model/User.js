import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';


const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,'PLease provide a name'],
        trim:true,
        maxlength:[50,'Name cannat be more than 50 characters']
    },
    email:{
    type:String,
        required:[true,'PLease provide a name'],
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
        required:[true,'PLease provide a name'],
         minlength:[6,'Password must be at least 6 characters'],
         select:false,
    }
},{
    timestamps:true
})


//hash the password before saving in  database
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