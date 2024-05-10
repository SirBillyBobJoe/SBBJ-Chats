
'use client'
import styles from './page.module.css'
import { useSearchParams } from 'next/navigation'
import io from 'socket.io-client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation'
import chatService from '../services/chat'

export default function Chat() {
    const searchParams = useSearchParams();
    const [name, setName] = useState<string>("")
    const [room, setRoom] = useState<string>("")
    const [chatMessages, setChatMessages] = useState<any[]>([])
    const [message, setMessage] = useState<string>("")
    const [activityText, setActivityText] = useState<string>("")
    const [socket, setSocket] = useState<any>(io('wss://sbbj-chats-service-27br4jjo7a-uc.a.run.app',{transports: ['websocket']}));
    const [userList, setUserList] = useState<any[]>([]);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
    const inputRef = useRef<any>(null);
    const messagesEndRef = useRef<any>(null);
    const chatContainerRef = useRef<any>(null);
    const activityTimerRef = useRef<any>(null);


    const [count, setCount] = useState<number>(1)

    const router = useRouter();

    useEffect(() => {
        const newSocket = io('wss://sbbj-chats-service-27br4jjo7a-uc.a.run.app',{transports: ['websocket']});
        setSocket(newSocket);

        const nameTemp = searchParams.get('name')
        if (nameTemp && nameTemp !== name) {
            setName(nameTemp)
        }
        const roomTemp = searchParams.get('room')
        if (roomTemp && roomTemp !== room) {
            setRoom(roomTemp)
        }

        const handleMessageReceived = (data: any) => {
            setChatMessages((prevMessages) => [...prevMessages, data]);
        };


        const handleActivity = (data: any) => {
            if (activityTimerRef.current) {
                clearTimeout(activityTimerRef.current);
            }


            activityTimerRef.current = setTimeout(() => {
                setActivityText("");
            }, 2000);

            setActivityText(`${data} is typing...`);
        };

        const handleUserList = (data: any) => {
            setUserList(data.users)
        };



        newSocket.on("message", handleMessageReceived);
        newSocket.on("activity", (data) => {
            handleActivity(data)
        });
        newSocket.on("userList", handleUserList)

        return () => {
            newSocket.off("message", handleMessageReceived);
            newSocket.disconnect();
        };

    }, [])

    useEffect(() => {
        if (name && room) {
            socket.emit('enterRoom', {
                name,
                room
            })
            
            chatService.getMsg(room, count).then(initialChat => {
                setChatMessages(initialChat)
                
            })
        }
    }, [name, room, socket])

    useEffect(() => {
        if (!isLoadingMore) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
        setIsLoadingMore(false)
    }, [chatMessages]);

    const sendMessage = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        socket.emit("message", { name, text: message })
        setMessage('')

        const msgObject = {
            name,
            time: new Date(),
            text: message,
        }

        chatService.addMsg(msgObject, room)
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }

    useEffect(() => {
        const handleScroll = () => {
            if (chatContainerRef && chatContainerRef.current.scrollTop === 0) {
                loadMoreMessages();
            }
        };

        const chatContainer = chatContainerRef.current;
        chatContainer.addEventListener('scroll', handleScroll);

        return () => chatContainer.removeEventListener('scroll', handleScroll);
    }, [chatMessages]);

    const loadMoreMessages = async () => {
        // Count of messages before loading more
        const oldMessageCount = chatMessages.length;


        const moreMessages = await chatService.getMsg(room, count + 1).then(msg=>{
            const newCount=count+1
            setCount(newCount)
            console.log(newCount)
            console.log(msg)
            return msg
        });
        setIsLoadingMore(true);

        setChatMessages(prevMessages => {

            const newMessageCount = moreMessages.length + oldMessageCount;


            const newMessagesPercentage = moreMessages.length / newMessageCount;

            setTimeout(() => {
                chatContainerRef.current.scrollTop = (chatContainerRef.current.scrollHeight * newMessagesPercentage);
            }, 0);
            return [...moreMessages, ...prevMessages];
        });
    };



    const handleMessage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(event.target.value)
        socket.emit('activity', name)
    }

    const onBack = () => {
        socket.disconnect();
        router.push(`/`);
    }

    function formatTime(dateTime: any) {
        const date = (dateTime instanceof Date) ? dateTime : new Date(dateTime);

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const day = days[date.getDay()];

        let hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();

        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;

        const formattedHours = String(hours).padStart(2, '0');
        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(seconds).padStart(2, '0');

        return `${day} ${formattedHours}:${formattedMinutes}:${formattedSeconds} ${ampm}`;
    }

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div onClick={onBack} className={styles.backButton}>Back</div>
                    <div className={styles.name}>
                        Name: {name}
                    </div>
                    <div className={styles.room}>
                        Room: {room}
                    </div>

                </div>
                <div className={styles.container} ref={chatContainerRef}>
                    {chatMessages.map((data, index) =>
                        <div className={data.name === name ?
                            styles.postRight :
                            data.name == "Admin" ?
                                styles.message : styles.postLeft
                        } key={index}>
                            {data.name != "Admin" && (<div className={styles.postHeaderName}>{data.name}</div>)}
                            <div className={styles.postHeaderTime}> {formatTime(data.time)}</div>
                            <div className={styles.postText}>{data.text}</div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className={styles.userList}>
                    Users in Chat:
                    {
                        userList && userList.map((user, index) => (<div key={index} className={styles.userContainer}>
                            <div  className={styles.user}>
                                {user.name}
                            </div>
                            {index < userList.length - 1 ? ', ' : ''}</div>
                        ))
                    }
                </div>



                <p className={styles.activity}>{`${activityText}`}</p>
                <form onSubmit={sendMessage} className={styles.formMessage}>
                    <input ref={inputRef} type="text" id="message" placeholder="Your message" required value={message} onChange={handleMessage} />
                    <button type="submit">Send</button>
                </form>
            </div>
        </main>

    )
}
