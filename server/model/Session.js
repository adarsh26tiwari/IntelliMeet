import mongoose from 'mongoose';


const sessionSchema = new mongoose.Schema({
    roomId:{ type: String, required: true, unquie:true,trim:true,index:true },
    host: {
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    hostName:{
        type:String,
        required:true
    },
    status:{
        type:String,
        enum:['active','ended'],
        default:'active'
    },
    participants: [{
        userId:{
               type:mongoose.Schema.Types.ObjectId,
        ref:'User',
                required:true
        },
        userName:{
            type:String,
                required:true

        },
        joinedAt:{
            type:Date,
            default:Date.now
        }
    }],
    startedAt:{
            type:Date,
            default:Date.now
    },
    endedAt:{
            type:Date,
            default:Date.now
    }
},{
    timestamps:true
});


sessionSchema.statics.generateRoomId = function() {
    const chars = 'ABDSICJHWLDICHWELFHNWFBC03830483048304';
    let roomId = '';
    for(let i=0;i<12; i++){
        roomId+= chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return roomId;
}



sessionSchema.statics.roomIdExists = async function(roomId) {
    const session = await this.findOne({roomId});
    return !!session;
}


export default mongoose.model('Session', sessionSchema)