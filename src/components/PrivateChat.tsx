type Props = {
  chatWith: string
}

export default function PrivateChat({ chatWith }: Props) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column"
      }}
    >
      <div
        style={{
          padding: 20,
          borderBottom: "1px solid #ddd"
        }}
      >
        <h2>Chat with {chatWith}</h2>
      </div>

      <div
        style={{
          flex: 1,
          padding: 20,
          overflowY: "auto"
        }}
      >
        Private messages here
      </div>
    </div>
  )
}