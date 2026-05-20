import React from 'react'
import { APP_CONFIG } from '../../utils/constants'
import { FaCheckCircle, FaVideo } from 'react-icons/fa';

const BenefitsSection = () => {
  const benefits = APP_CONFIG.BENEFITS;
  return (
    <section className='py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100'>
      <div className='max-w-7xl mx-auto'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>

          <div className='relative'>
            <div className='bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 shadow-2xl'>
              <div className='aspect-video bg-white/10 rounded-lg backdrop-blur-sm flex items-center justify-center'>
              <FaVideo className='w-24 h-24 text-white opacity-50'/>

              </div>

            </div>
            <div className='absolute -top-4 -right-4 w-24 h-24 bg-yellow-400 rounded-full opacity-20 blur-2xl'></div>
            <div className='absolute -bottom-4 -left-4 w-24 h-24 bg-pink-400 rounded-full opacity-20 blur-2xl'></div>
          </div>

          <div>
            <h2 className='text-4xl font-bold text-gray-900 mb-6'>
              {APP_CONFIG.HOME_CONTENT.BENEFITS.HEADING.replace('{APP_NAME}', APP_CONFIG.APP_NAME)}

            </h2>
            <p className='text-xl text-gray-600 mb-8'>
              {APP_CONFIG.HOME_CONTENT.BENEFITS.DESCRIPTION}
            </p>
            <ul className='space-y-4'>
              {benefits.map((benefit,index) => (
                <li key={index} className='flex items-center'>
                  <FaCheckCircle className='w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0'/>
                  <span className='text-lg text-gray-700'>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>
    </section>
  )
}

export default BenefitsSection