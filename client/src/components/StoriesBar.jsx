import React, { useEffect, useState } from 'react'
import { dummyStoriesData } from '../assets/assets'
import { Plus } from 'lucide-react'
import moment from 'moment'
import StoryModel from './StoryModel'
import { StoryViewer } from './StoryViewer'
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
import { Trash2 } from "lucide-react";



const StoriesBar = () => {

    const currentUser = useSelector((state) => state.user.value)
    const {getToken} = useAuth()
    const [stories , setStories] = useState([])
    const [ShowModal , setShowModal] = useState(false)
    const [viewStory , setViewStory] = useState(null)


    const fetchStories = async () => {
        try {
            const token = await getToken()
            const {data} = await api.get('/api/story/get' , {
                headers : { Authorization : `Bearer ${token}`}
            })

            if(data.success){
                setStories(data.stories)
            }else{
                toast(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const handleDeleteStory = async (storyId) => {
        try {
            const token = await getToken();

            const { data } = await api.delete(
                `/api/story/delete/${storyId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (data.success) {
                toast.success(data.message);
                fetchStories();
            } else {
                toast.error(data.message);
            }

        } catch (error) {
            toast.error(error.message);
        }
    };

    useEffect(()=>{
        fetchStories()
    },[])
  return (
    <div className='w-screen sm:w-[calc(100vw-240px)] lg:max-w-2xl no-scrollbar
    overflow-x-auto px-4'>

        <div className='flex gap-4 pb-5' >
            {/* Add Story Card */}
            <div onClick={()=>setShowModal(true)} className='rounded-lg shadow-sm min-w-30 max-w-30 max-h-40
            aspect-[3/4] cursor-pointer hover:shadow-lg transition-all duration-200 
            border-2 border-dashed border-indigo-300 bg-gradient-to-b from-indigo-50 to-white'>
                <div className='h-full flex flex-col items-center justify-center p-4'>
                    <div className='size-10 bg-blue-500 rounded-full flex items-center justify-center mb-3'>
                        <Plus className='w-5 h-5 text-white'/>
                    </div>
                    <p className='text-sm font-medium text-slate-700
                    text-center'>Create Story</p>
                </div>    
            </div>
            {/* Story Cards */}
            
            {stories?.map((story) => (
            <div
                key={story._id}
                onClick={() => setViewStory(story)}   // 👈 YE ADD KARNA HAI (story open karega)
                className="relative rounded-lg shadow min-w-30 max-w-30 max-h-40 cursor-pointer hover:shadow-lg transition-all duration-200 bg-gradient-to-b from-indigo-500 to-blue-600 hover:from-indigo-700 hover:to-blue-800 active:scale-95"
            >

                {/* Delete Button (Only Owner) */}
                {story.user?._id === currentUser?._id && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStory(story._id);
                    }}
                    className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-black/30 backdrop-blur hover:bg-red-500 transition transform hover:scale-110"
                    >
                    <Trash2 size={16} className="text-white/80 hover:text-white" />
                </button>
                )}

                {/* Profile Image */}
                <img
                src={story.user?.profile_picture || ""}
                alt=""
                className="absolute size-8 top-3 left-3 z-10 rounded-full ring ring-gray-100 shadow"
                />

                {/* Content */}
                <p className="absolute top-18 left-3 text-white/60 text-sm truncate max-w-24">
                {story.content}
                </p>

                {/* Time */}
                <p className="text-white absolute bottom-1 right-2 z-10 text-xs">
                {moment(story.createdAt).fromNow()}
                </p>

                {/* Media */}
                {story.media_type !== 'text' && story.media_url && (
                <div className="absolute inset-0 z-1 rounded-lg bg-black overflow-hidden">
                    {story.media_type === "image" ? (
                    <img
                        src={story.media_url}
                        alt=""
                        className="h-full w-full object-cover opacity-70"
                    />
                    ) : (
                    <video
                        src={story.media_url}
                        className="h-full w-full object-cover opacity-70"
                    />
                    )}
                </div>
                )}

            </div>
            ))}

            
        </div>
        {/* Add Story Modal */}
        {ShowModal && <StoryModel setShowModal={setShowModal} fetchStories={fetchStories}/>}
        {/* View Story Modal */}
        {viewStory && <StoryViewer viewStory={viewStory} setViewStory={setViewStory} />}
    </div>
  )
}

export default StoriesBar