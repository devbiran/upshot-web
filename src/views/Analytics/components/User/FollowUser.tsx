import { useMutation, useQuery } from '@apollo/client'
import { Button, Icon } from '@upshot-tech/upshot-ui'
import {
  FOLLOW_USER,
  FollowUserData,
  FollowUserVars,
  UNFOLLOW_USER,
  UnFollowUserData,
  UnFollowUserVars,
} from 'graphql/mutations'
import {
  GET_USER_FOLLOWINGS,
  GetUserFollowingsData,
  GetUserFollowingsVars,
} from 'graphql/queries'
import { useAuth } from 'hooks/auth'
import { useEffect, useState } from 'react'
import { useAppSelector } from 'redux/hooks'
import { selectAddress } from 'redux/reducers/web3'
import { selectSignedUserId } from 'redux/reducers/web3'

export default function FollowUSer({ userId }: { userId: number }) {
  const address = useAppSelector(selectAddress)
  const { isAuthed, triggerAuth } = useAuth()
  const [callAuth, setCallAuth] = useState(false)

  const signedUserId = useAppSelector(selectSignedUserId)
  const { data, loading } = useQuery<
    GetUserFollowingsData,
    GetUserFollowingsVars
  >(GET_USER_FOLLOWINGS, {
    variables: { userId: signedUserId },
    skip: !signedUserId,
  })
  const [followings, setFollowings] = useState(data?.usersFollowedByUser)
  useEffect(() => {
    setFollowings(data?.usersFollowedByUser)
  }, [data])

  useEffect(() => {
    if (!isAuthed && callAuth) {
      triggerAuth({
        onError: (err) => {
          console.error(err)
          setCallAuth(false)
        },
      })
    }
  }, [isAuthed, address, triggerAuth, callAuth])
  const [unfollowUser] = useMutation<UnFollowUserData, UnFollowUserVars>(
    UNFOLLOW_USER
  )
  const [followUser] = useMutation<FollowUserData, FollowUserVars>(FOLLOW_USER)

  const handleFollowUser = async () => {
    if (!isAuthed) {
      setCallAuth(true)
      return
    }
    await followUser({
      variables: {
        userId,
      },
      onCompleted: (data) => {
        const updatedFollowings = followings
          ? [...followings, { id: userId }]
          : []
        setFollowings(updatedFollowings)
      },
      onError: (err) => {
        console.error(err)
      },
    })
  }
  const handleUnFollowUser = async () => {
    if (!isAuthed) {
      setCallAuth(true)
      return
    }
    await unfollowUser({
      variables: {
        userId,
      },
      onCompleted: (data) => {
        const updatedFollowings = followings
          ? followings.filter((user) => user.id !== userId)
          : []
        setFollowings(updatedFollowings)
      },
      onError: (err) => {
        console.error(err)
      },
    })
  }
  const isFollowing = () => {
    return (
      (followings &&
        followings.filter((user) => user.id === userId).length > 0) ||
      false
    )
  }
  if (loading) return <></>
  if (isFollowing())
    return (
      <Button
        icon={<Icon icon={'checkmark'} />}
        variant="secondary"
        capitalize={true}
        onClick={handleUnFollowUser}
      >
        Following
      </Button>
    )
  return (
    <Button variant="secondary" capitalize={true} onClick={handleFollowUser}>
      + Follow
    </Button>
  )
}
