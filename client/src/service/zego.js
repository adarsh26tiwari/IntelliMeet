import {ZegoUIKitPrebuilt} from '@zegocloud/zego-uikit-prebuilt';
import { ZEGO_CONFIG } from '../utils/constants';


let zegoInstance = null;
let userHasJoined = false;
let isDestroying = false;



export const generateKitToken = (roomId,userId,userName) => {
    if(!ZEGO_CONFIG.APP_ID){
        throw new Error('ZEGOCLOUD App Id not configured. Please set the value in env')
    }

    const appId = parseInt(ZEGO_CONFIG.APP_ID);
    if(isNaN(appId)){
        throw new Error('Invalid Zegocloud app id .Must be in number')
    }

    try {
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest( 
            appId,
            ZEGO_CONFIG.SERVER_SECRET || '',
            roomId,
            userId.toString(),
            userName || `User_${userId}`
        )

        if(!kitToken){
            throw new Error('Token generation returned empty token')
        }

        return kitToken;
    } catch (error) {
        console.error('Token generation error', error);
        throw new Error(`Failed to generate zego token', ${error.message}`)
    }
}


//Request  brower permission for camera and mixrophone

const requestMediaPermission = async () => {
    try {
         const stream = await navigator.mediaDevices.getUserMedia({
            video:true,
            audio:true
         })
         stream.getTracks().forEach(track => track.stop());
         return true;
    } catch (error) {
     console.error('Failed to get media permission',error);
     return false;   
    }
}

export const joinRoom = async(roomId,userId,userName,container,onJoinCallback,onLeaveCallback) => {
    if(!container){
        throw new Error('Container element is required')
    }


    if(!ZEGO_CONFIG.APP_ID){
        throw new Error('Zegocloud App Id is not configured')
    }

    //clean up exiting instance if any 
    if(zegoInstance && !isDestroying){
        try {
             isDestroying= true;
             const instance = zegoInstance;
             zegoInstance= null;


             if(instance && typeof instance.destroy === 'function'){
                instance.destroy();
             }

             userHasJoined = false;
        } catch (error) {
            console.error('Error cleaning up exiting zego instance',error)
        }finally{
            isDestroying= false;
        }
    }


    let hasPermission = false;
    try {
        hasPermission = await requestMediaPermission();
        if(!hasPermission){
            console.warn('Medai permission not granted upfront, SDK will request them')
        }
    } catch (error) {
        console.warn('cound not pre-request permission ,SDK will handle it', error)
    }


    let kitToken;
    try {
        kitToken = generateKitToken(roomId,userId,userName);
        if(!kitToken){
            throw new Error('failed to generate kit token')
        }
    } catch (error) {
        console.error('token generation error',error);
        throw new Error(`faild to generate zego token: ${error.message}`)
    }

    //Create a ZEGO UIkIT instance
    let zp;
    try {
         zp = ZegoUIKitPrebuilt.create(kitToken);
         if(!zp){
            throw new Error('failed to create zego Uikit instance')
         }
    } catch (error) {
           console.error('ZEGO instance creation error',error);
        throw new Error(`faild to create Zego instace: ${error.message}`)
    }

    //small delay
    await new Promise(resolve => setTimeout(resolve,100))

    //join room with prebuild ui 
    try {
        zp.joinRoom({
            container:container,
            scenario:{
                mode:ZegoUIKitPrebuilt.GroupCall,
            },
            turnOnCameraWhenJoining:hasPermission,
            turnOnMicrophoneWhenJoining:hasPermission,
            showMyCameraToggleButton:true,
            showMyMicrophoneToggleButton:true,
            showAudioVideoSettingsButton:true,
            showTextChat:true,
            showUserList:true,
            onJoinRoom: () => {
                userHasJoined = true;
                if(onJoinCallback && typeof onJoinCallback === 'function'){
                    onJoinCallback();
                }
            },
            onLeaveRoom: () => {
                userHasJoined= false;
                   if(onLeaveCallback && typeof onLeaveCallback === 'function'){
                    onLeaveCallback();
                }
            },
            onError: (error) => {
                console.error('ZEGO room error', error)
            },
        });
    } catch (error) {
        console.error('Error joining Zego room', error);
        if(zp && typeof zp.destroy === 'function' && !isDestroying){
            try {
                isDestroying = false;
                zp.destroy();
            } catch (error) {
                console.error('Error destring zego instance',error)
            }finally{
                isDestroying=false;
            }
        }
        zegoInstance = null;
        userHasJoined=false;
        throw new Error(`Failed tp join room ${error.message}`)
    }
    zegoInstance= zp;
    return zp;
}



export const leaveRoom = (onLeaveCallback) => {
    if(!zegoInstance || isDestroying){
        if(onLeaveCallback && typeof onLeaveCallback === 'function'){
            onLeaveCallback();
        }
            return;
    }


    isDestroying= true;
    const instance = zegoInstance;
    zegoInstance= null;
    userHasJoined= false;


    if(onLeaveCallback && typeof onLeaveCallback === 'function'){
        try {
             onLeaveCallback();
        } catch (error) {
            console.error('error in leaveRoom callback', error)
        }
    }

    try {
         if(instance && typeof instance.destroy === 'function'){
            instance.destroy();
         }else if(instance && typeof instance.leaveRoom === 'function'){
            instance.leaveRoom();
         }
    } catch (error) {
        console.error('Error leaving zego room', error)
    }finally{
        isDestroying = false;
    }
}


export const getZegoInstance = () => {
    return zegoInstance;
}


export const hasUserJoined = () => {
    return userHasJoined;
}