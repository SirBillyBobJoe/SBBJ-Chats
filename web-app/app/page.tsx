'use client'

import styles from './page.module.css'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import chatService from './services/chat'
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';

export default function Home() {
  chatService
  const [roomList, setRoomList] = useState<any[]>([]);
  const [name, setName] = useState<string>("");
  const [room, setRoom] = useState<string>("");
  const router = useRouter();

  const createRoom = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const chatObject = {
      name: room,
      owner: name
    }
    chatService
      .create(chatObject)
      .then(initialChat => {
        setRoom('')
      })
  }


  const handleName = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newName = event.target.value
    setName(newName)
    localStorage.setItem('userName', newName)
  }

  const handleRoomName = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRoomName = event.target.value
    setRoom(newRoomName)
  }

  const onSubmit = (room: String) => {
    router.push(`/chat?name=${name}&room=${room}`);
    localStorage.setItem('userName', name)
  }

  useEffect(() => {
    const storedName = localStorage.getItem('userName')
    if (storedName) {
      setName(storedName)
    }
  }, [room])

  useEffect(() => {
    chatService
      .getAll()
      .then(initialChat => {
        setRoomList(initialChat)
      })
  }, [room])

  const onDelete = (roomName: string) => {
    const isConfirmed = window.confirm(`Are you sure you want to delete the room "${roomName}"?`);
    if (isConfirmed) {
      chatService.deleteChat(roomName)
      setRoomList(roomList.filter(r => r.name !== roomName))
      toast.success("Room deleted successfully", { position: 'top-center' });
    } else {
      toast.error("Room deletion cancelled", { position: 'top-center' });
    }
  }
  return (

    <main className={styles.main}>
      <ToastContainer />
      <div className={styles.container}>
        <form onSubmit={createRoom}>
          <ul className={styles.roomDisplay}>
            <div className={styles.header}>
              <h1>Welcome to the SBBJ Chat</h1>
              <input placeholder="Name..." className={styles.name} value={name} required onChange={handleName} />
              <div className={styles.subHeader}>
                Click below to join a chat room
              </div>
            </div>

          </ul>


          <input placeholder="Room Name..." className={styles.name} value={room} required onChange={handleRoomName} />
          <button className={styles.createRoom}>Create Room</button>
        </form>
        {
          roomList.map((room, index) =>
            <div key={index} className={styles.room}>
              <div className={styles.roomName}>{room.name}</div>
              {room.owner == name && (<img src="delete.png" className={styles.delete} onClick={() => onDelete(room.name)} />)}
              <button onClick={() => onSubmit(room.name)} className={styles.join} >Join Chat</button>
            </div>
          )
        }

      </div>
    </main>

  )
}
