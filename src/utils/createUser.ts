export type User = {
  username: string
}

export const createUser = (): User => {
  const username = `USER-${Date.now()}`

  return {
    username  
  }
}