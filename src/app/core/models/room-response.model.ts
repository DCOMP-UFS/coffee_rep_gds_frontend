export interface RoomResponseModel {
  content: Room[]
}

export interface Room{
  name: string,
  type: string,
  section: string
}
