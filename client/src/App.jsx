import React, { useRef, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Login from './pages/login'
import Feed from './pages/Feed'
import Messages from './pages/Messages'
import ChatBox from './pages/ChatBox'
import Connection from './pages/Connections'
import Discover from './pages/Discover'
import Profile from './pages/Profile'
import CreatePost from './pages/CreatePost'
import { useUser, useAuth } from '@clerk/clerk-react'
import Layout from './pages/Layout'
import toast, { Toaster } from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import { fetchUser } from './features/user/userSlice'
import { fetchConnections } from './features/connections/connectionsSlice'
import { addMessage } from './features/messages/messagesSlice'
import { setOnlineUsers } from './features/Online/onlineSlice'
import Notifications from './components/Notifications'

const App = () => {
  const { user } = useUser()
  const { getToken } = useAuth()
  const { pathname } = useLocation()
  const pathnameRef = useRef(pathname)
  const dispatch = useDispatch()

  // ================= FETCH USER DATA =================
  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const token = await getToken()
        dispatch(fetchUser(token))
        dispatch(fetchConnections(token))
      }
    }

    fetchData()
  }, [user, getToken, dispatch])

  // ================= TRACK CURRENT PATH =================
  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  // ================= SSE CONNECTION =================
  useEffect(() => {
    if (!user) return

    const eventSource = new EventSource(
      import.meta.env.VITE_BASEURL + '/api/message/' + user.id
    )

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        // 🟢 ONLINE USERS UPDATE
        if (data.type === "online") {
          dispatch(setOnlineUsers(data.onlineUsers))
          return
        }

        // Ignore initial connection message
        if (data.type === "connected") return

        const message = data

        // 💬 If chat page open → directly add message
        if (
          pathnameRef.current === '/messages/' + message?.from_user_id?._id
        ) {
          dispatch(addMessage(message))
        } 
        // 🔔 Else show notification
        else {
          toast.custom(
            (t) => (
              <Notifications t={t} message={message} />
            ),
            { position: "bottom-right" }
          )
        }

      } catch (error) {
        console.log("Non-JSON message:", event.data)
      }
    }

    eventSource.onerror = (error) => {
      console.log("SSE Error:", error)
    }

    return () => {
      eventSource.close()
    }

  }, [user, dispatch])

  return (
    <>
      <Toaster />
      <Routes>
        <Route path='/' element={!user ? <Login /> : <Layout />}>
          <Route index element={<Feed />} />
          <Route path='messages' element={<Messages />} />
          <Route path='messages/:userId' element={<ChatBox />} />
          <Route path='connections' element={<Connection />} />
          <Route path='discover' element={<Discover />} />
          <Route path='profile' element={<Profile />} />
          <Route path='profile/:profileId' element={<Profile />} />
          <Route path='create-post' element={<CreatePost />} />
        </Route>
      </Routes>
    </>
  )
}

export default App