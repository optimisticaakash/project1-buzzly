import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Loading from '../components/Loading'
import { useSelector } from 'react-redux'
import api from '../api/axios'
import { useAuth } from '@clerk/clerk-react'

const Layout = () => {

  const user = useSelector((state) => state.user.value)
  const { getToken } = useAuth()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState({})

  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        const token = await getToken()
        const { data } = await api.get('/api/message/online', {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (data.success) {
          setOnlineUsers(data.onlineUsers)
        }
      } catch (error) {
        console.log(error)
      }
    }

    if (user) {
      fetchOnlineUsers()
    }
  }, [user])

  return user ? (
    <div className='w-full flex h-screen'>

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className='flex-1 bg-slate-50'>
        <Outlet context={{ onlineUsers }} />
      </div>

      {sidebarOpen ? (
        <X className='absolute top-3 right-3 p-2 bg-white rounded-md shadow w-10 h-10 text-gray-600 sm:hidden'
          onClick={() => setSidebarOpen(false)} />
      ) : (
        <Menu className='absolute top-3 right-3 p-2 bg-white rounded-md shadow w-10 h-10 text-gray-600 sm:hidden'
          onClick={() => setSidebarOpen(true)} />
      )}

    </div>
  ) : (
    <Loading />
  )
}

export default Layout