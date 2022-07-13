import {
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip
} from "@mui/material"
import ChatIcon from "@mui/icons-material/Chat"
import MoreVerticalIcon from "@mui/icons-material/MoreVert"
import LogoutIcon from "@mui/icons-material/Logout"
import SearchIcon from "@mui/icons-material/Search"

import styled from "styled-components"
import { signOut } from "firebase/auth"
import { auth, db } from "../config/firebase"
import { useAuthState } from "react-firebase-hooks/auth"
import { useCollection } from "react-firebase-hooks/firestore"
import { useState } from "react"
import * as EmailValidator from "email-validator"
import { addDoc, collection, query, where } from "firebase/firestore"
import { Conversation } from "../types"
import ConversationSelect from "./ConversationSelect"

const StyledContainer = styled.div`
  height: 100vh;
  min-width: 300px;
  max-width: 350px;
  overflow-y: scroll;
  border-right: 1px solid whitesmoke;
  ::-webkit-scrollbar {
    display: none;
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`
const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  height: 80px;
  border-bottom: 1px solid whitesmoke;
  position: sticky;
  top: 0;
  background-color: white;
  z-index: 1;
`
const StyledSearch = styled.div`
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: 12px;
`
const StyledSidebarButton = styled(Button)`
  width: 100%;
  border-top: 1px solid whitesmoke;
  border-bottom: 1px solid whitesmoke;
`

const StyledUserAvatar = styled(Avatar)`
  cursor: pointer;
  :hover {
    opacity: 0.8;
  }
`

const StyledSearchInput = styled.input`
  outline: none;
  border: none;
  flex: 1;
`

const Sidebar = () => {
  const [loggedInUser, _loading, _error] = useAuthState(auth)
  const [isOpentNewConversnDialog, setIsOpentNewConversnDialog] =
    useState(false)
  const [recipientEmail, setRecipientEmail] = useState("")

  const toggleNewConversDialog = (isOpen: boolean) => {
    setIsOpentNewConversnDialog(isOpen)

    if (!isOpen) {
      setRecipientEmail("")
    }
  }

  const closeNewConversDialog = () => {
    toggleNewConversDialog(false)
  }

  // check if conversation already exists between the current logged in user and recipient
  const queryGetConversationsForCurrentUser = query(
    collection(db, "conversations"),
    where("users", "array-contains", loggedInUser?.email)
  )
  const [conversationsSnapshot, _loadingConvers, _errorConvers] = useCollection(
    queryGetConversationsForCurrentUser
  )

  const isConverAlreadyExists = (recipientEmail: string) => {
    return conversationsSnapshot?.docs.find((conversation) =>
      (conversation.data() as Conversation).users.includes(recipientEmail)
    )
  }

  const isInvitingSelf = recipientEmail === loggedInUser?.email

  const createConvers = async () => {
    if (!recipientEmail) return

    if (
      EmailValidator.validate(recipientEmail) &&
      !isInvitingSelf &&
      !isConverAlreadyExists(recipientEmail)
    ) {
      // add conversation user to db 'conversations'
      // a conversation is between the currently logged in user and the user invited

      await addDoc(collection(db, "conversations"), {
        users: [loggedInUser?.email, recipientEmail]
      })
    }

    console.log("create")
    closeNewConversDialog()
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.log("Error loggin out!", error)
    }
  }

  return (
    <StyledContainer>
      <StyledHeader>
        <Tooltip title={loggedInUser?.email as string} placement="right">
          <StyledUserAvatar src={loggedInUser?.photoURL || ""} />
        </Tooltip>
        <div>
          <IconButton>
            <ChatIcon />
          </IconButton>
          <IconButton>
            <MoreVerticalIcon />
          </IconButton>
          <IconButton onClick={logout}>
            <LogoutIcon />
          </IconButton>
        </div>
      </StyledHeader>
      <StyledSearch>
        <SearchIcon />
        <StyledSearchInput placeholder="Search in conversations" />
      </StyledSearch>

      <StyledSidebarButton onClick={() => toggleNewConversDialog(true)}>
        Start a new conversation
      </StyledSidebarButton>

      {/* list of conversations */}
      {conversationsSnapshot?.docs.map((conversation) => (
        <ConversationSelect
          key={conversation.id}
          id={conversation.id}
          conversationUsers={(conversation.data() as Conversation).users}
        />
      ))}

      <Dialog open={isOpentNewConversnDialog} onClose={closeNewConversDialog}>
        <DialogTitle>New conversation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter a Google email address for the user you wish to chat
            with
          </DialogContentText>
          <TextField
            autoFocus
            label="Email Address"
            type="email"
            fullWidth
            variant="standard"
            value={recipientEmail}
            onChange={(event) => {
              setRecipientEmail(event.target.value)
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeNewConversDialog}>Cancel</Button>
          <Button disabled={!recipientEmail} onClick={createConvers}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </StyledContainer>
  )
}

export default Sidebar
