export default function Home() {
  return (
    <div
      style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: "80px 24px",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
        Classical AI Tutor
      </h1>
      <p style={{ fontSize: 16, color: "#555", lineHeight: 1.6 }}>
        Welcome! To start your tutoring session, please use the link your
        teacher shared with you.
      </p>
      <p
        style={{
          fontSize: 14,
          color: "#999",
          marginTop: 24,
          lineHeight: 1.6,
        }}
      >
        If you don&apos;t have a link, ask your teacher for your session URL.
      </p>
    </div>
  );
}
