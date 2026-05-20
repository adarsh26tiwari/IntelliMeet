import React from 'react'
import HeroSection from '../components/Home/HeroSection'
import FeatureSection from '../components/Home/FeatureSection'
import BenefitsSection from '../components/Home/BenefitsSection'
import CTASection from '../components/Home/CTASection'

const Home = () => {
  return (
    <div className='min-h-screen bg-white'>
        <HeroSection/>
        <FeatureSection/>
        <BenefitsSection/>
        <CTASection/>
    </div>
  )
}

export default Home