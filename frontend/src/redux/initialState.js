const initialState = () => {
  const initialValue = {
    aboutMe: {
      isMe: false,
      isCreator: false
    },

    user: {},

    organizations: [],

    departments: {},

    department: {}
  }

  return JSON.parse(localStorage.getItem('redux')) || initialValue

}

/*  const initialValue = {
      aboutMe: {
        isMe: true/false
      },

     user: {
      name: 'dfd'
      surname
      email
      id
     },

    contactsForChat: [
      {
        id: 'a',
        surname:
        name:

    },
      {},

    ]
// }
*/


export default initialState


