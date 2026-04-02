import React from 'react'
import {assets} from '../assets/assets'
import { MessageCircleMore, ShieldCheck, Sparkles, Star } from 'lucide-react'
import {SignIn} from '@clerk/clerk-react'


const Login = () => {
    return(
        <div className='relative min-h-screen flex flex-col md:flex-row overflow-hidden bg-slate-100'>
            <img src={assets.bgimageJpg} alt='' className='absolute inset-0 -z-20 h-full w-full object-cover' />
            <div className='absolute inset-0 -z-10 bg-white/28' />
            <div className='absolute inset-0 -z-10 bg-[linear-gradient(90deg,_rgba(255,255,255,0.18)_0%,_rgba(255,255,255,0.08)_38%,_rgba(255,255,255,0.12)_100%)]' />

            {/*left side : Branding */}
            <div className='flex-1 flex flex-col items-start justify-between p-6 md:p-10
            lg:pl-40'>
                <img src={assets.logoo} alt='' className='h-12 object-contain' />
                    <div className='max-w-xl'>
                    <div className='inline-flex items-center gap-2 rounded-full border border-white/75 bg-white/72 px-4 py-2 text-xs md:text-sm font-medium text-slate-700 shadow-sm backdrop-blur-md max-md:mt-8 mb-6'>
                            <img src={assets.group_users} alt='' className='h-8 md:h-10'/>
                            <div className='flex'>
                                {Array(5).fill(0).map((_,i)=>(<Star key={i}
                                className='size-4 md:size-4.5 text-transparent
                                fill-amber-500' />))}
                            </div>
                            <p className='text-slate-700'>A space to share, connect, and explore</p>
                        </div>
                    <h1 className='text-3xl md:text-4xl lg:text-5xl md:pb-1 font-bold leading-[1.05] bg-gradient-to-r
                    from-slate-900 via-indigo-900 to-slate-700 bg-clip-text text-transparent'>Share your ideas, build real connections</h1>
                    <p className='mt-4 text-base md:text-xl text-slate-700 max-w-sm md:max-w-lg leading-[1.3]' >Join Buzzly to discover people, stories, and conversations that matter.</p>

                    <div className='mt-7 grid max-w-3xl gap-3 sm:grid-cols-2'>
                        <div className='rounded-3xl border border-white/75 bg-white/70 p-4 shadow-sm backdrop-blur-md'>
                            <div className='mb-2 flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-100 text-sky-600'>
                                <Sparkles className='size-4.5' />
                            </div>
                            <p className='text-sm font-semibold text-slate-900'>Create and express</p>
                            <p className='mt-1 text-xs md:text-sm leading-5 text-slate-600'>Share posts, stories, and moments in a simple and engaging way.</p>
                        </div>

                        <div className='rounded-3xl border border-white/75 bg-white/70 p-4 shadow-sm backdrop-blur-md'>
                            <div className='mb-2 flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-100 text-violet-600'>
                                <MessageCircleMore className='size-4.5' />
                            </div>
                            <p className='text-sm font-semibold text-slate-900'>Connect in real time</p>
                            <p className='mt-1 text-xs md:text-sm leading-5 text-slate-600'>Chat with people, stay updated, and keep conversations flowing.</p>
                        </div>
                    </div>
                </div>

                <div className='hidden md:flex mt-6 items-center gap-3 rounded-2xl border border-white/75 bg-white/70 px-4 py-3 text-slate-700 shadow-sm backdrop-blur-md'>
                    <ShieldCheck className='size-5 text-emerald-600' />
                    <p className='text-sm'>Built for smooth sign-in today and flexible themes tomorrow.</p>
                </div>
            </div>
            {/* Right side: Login Form */}
            <div className='flex-1 flex items-center justify-center p-6 sm:p-10'>
                   <SignIn />          
            </div>
        </div>
    )
}

export default Login
