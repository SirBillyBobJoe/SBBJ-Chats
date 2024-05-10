import axios from 'axios'
const baseUrl = 'https://sbbj-chats-service-27br4jjo7a-uc.a.run.app/api/chats'

const getAll = () => {
  const request = axios.get(baseUrl)
  return request.then(response => response.data)
}

const create = (newObject: any) => {
  const request = axios.post(baseUrl, newObject)
  return request.then(response => response.data)
}

const deleteChat = (chat: string) => {
  const newUrl = `${baseUrl}/${chat}`
  const request = axios.delete(newUrl)
  return request.then(response => response.data)
}

const addMsg = (newObject: any, chat: string) => {
  const newUrl = `${baseUrl}/${chat}`
  const request = axios.post(newUrl, newObject)
  return request.then(response => response.data)
}

const getMsgAll = (chat: string) => {
  const newUrl = `${baseUrl}/${chat}`
  const request = axios.get(newUrl)
  return request.then(response => response.data.reverse())
}

const getMsg = (chat: string, index: number) => {
  const newUrl = `${baseUrl}/${chat}/${index}`
  const request = axios.get(newUrl)
  return request.then(response => response.data.reverse())
}






export default {
  getAll, create, addMsg, getMsgAll, getMsg,deleteChat
}