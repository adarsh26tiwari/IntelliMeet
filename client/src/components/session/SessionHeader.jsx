import React from 'react'
import { FaArrowLeft } from 'react-icons/fa'
import { APP_CONFIG } from '../../utils/constants'

const SessionHeader = ({title,roomId,userName,onBack,showEndBUtton,onEndSession}) => {
  return (
   <header className='bg-white shadow-sm border-b border-gray-200'>
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
        <div className='flex justify-between items-center'>
            <div className='flex items-center space-x-4'>
                <button
                 onClick={onBack}
                 className='p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                >
                    <FaArrowLeft className='w-5 h-5'/>
                </button>
                <div>
                    <h1 className='text-xl font-bold text-gray-900'>
                        {title}
                    </h1>
                    <p className='text-xm text-gray-500'>
                        Room ID: {roomId}
                    </p>
                </div>

            </div>

            <div className='flex items-center space-x-4'>
                {userName && (
                    <div className='hidden sm:flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg'>
                        <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center'>
                            <span className='text-white text-xs font-semibold'>
                                {userName?.charAt(0).toUpperCase()}
                            </span>
                            </div>
                            <span className='text-gray-700 font-medium text-sm'>
                                {userName}
                            </span>
                        </div>
                )}

                {showEndBUtton && (
                    <button
                     onClick={onEndSession}
                     className='px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors shadow-sm'
                    >
                        {APP_CONFIG.SESSION_CONTENT.HEADER.END_SESSION_BUTTON}
                    </button>
                )}

            </div>

        </div>

    </div>
   </header>
  )
}

export default SessionHeader