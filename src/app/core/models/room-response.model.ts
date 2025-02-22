export interface RoomResponseModel {
  content: Room[]
}

export interface Room{
  id: number,
  nome: string,
  status: string,
  tipo: string,
  setor: string
}
