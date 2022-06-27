import React from 'react'
import { ImageType } from 'react-images-uploading'

export default function ImageCard({
  image,
  name,
  description,
}: {
  image: ImageType
  name: string
  description: string
}) {

  return (
    <div className="rounded flex-shrink-0 bg-gray-100 shadow-md h-80 w-60 flex flex-col border-2 border-gray-200">
      {image['data_url'] == undefined ? (
        <h1>Image could not be found!</h1>
      ) : (
        <img src={image['data_url']} />
      )}
      <div className="justify-self-end justify-start bg-white h-full p-2">
        <p className="truncate">Name: {name}</p>
        <p className="truncate">Description: {description}</p>
      </div>
    </div>
  )
}
