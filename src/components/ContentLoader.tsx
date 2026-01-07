interface ContentLoaderProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  centered?: boolean;
}

export default function ContentLoader({ 
  message = 'Loading...', 
  size = 'medium',
  centered = true 
}: ContentLoaderProps) {
  const sizeMap = {
    small: { spinner: '30px', fontSize: '14px' },
    medium: { spinner: '50px', fontSize: '16px' },
    large: { spinner: '70px', fontSize: '18px' },
  };

  const { spinner, fontSize } = sizeMap[size];

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    ...(centered && {
      width: '100%',
      minHeight: '200px',
    }),
  };

  return (
    <div style={containerStyle}>
      <div
        style={{
          width: spinner,
          height: spinner,
          border: `4px solid #f3f3f3`,
          borderTop: `4px solid #dd3333`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem',
        }}
      />
      <p
        style={{
          fontFamily: 'Rubik, sans-serif',
          fontSize: fontSize,
          color: '#363f48',
          margin: 0,
        }}
      >
        {message}
      </p>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}



