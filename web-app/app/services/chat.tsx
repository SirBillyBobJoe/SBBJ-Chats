import axios from 'axios'
const baseUrl = 'https://sbbj-chats-service-27br4jjo7a-uc.a.run.app/api/chats'

const getAll = async () => {
  const request = axios.get(baseUrl)
  const response = await request
  return response.data
}

const create = async (newObject: any) => {
  const request = axios.post(baseUrl, newObject)
  const response = await request
  return response.data
}

const deleteChat = async (chat: string) => {
  const newUrl = `${baseUrl}/${chat}`
  const request = axios.delete(newUrl)
  const response = await request
  return response.data
}

const addMsg = async (newObject: any, chat: string) => {
  const newUrl = `${baseUrl}/${chat}`
  const request = axios.post(newUrl, newObject)
  const response = await request
  return response.data
}

const getMsgAll = async (chat: string) => {
  const newUrl = `${baseUrl}/${chat}`
  const request = axios.get(newUrl)
  const response = await request
  return response.data.reverse()
}

const getMsg = async (chat: string, index: number) => {
  const newUrl = `${baseUrl}/${chat}/${index}`
  const request = axios.get(newUrl)
  const response = await request
  return response.data.reverse()
}

export default {
  getAll,
  create,
  addMsg,
  getMsgAll,
  getMsg,
  deleteChat,
}
