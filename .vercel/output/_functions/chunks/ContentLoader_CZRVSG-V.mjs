import { jsxs, jsx } from 'react/jsx-runtime';

function ContentLoader({
  message = "Loading...",
  size = "medium",
  centered = true
}) {
  const sizeMap = {
    small: { spinner: "30px", fontSize: "14px" },
    medium: { spinner: "50px", fontSize: "16px" },
    large: { spinner: "70px", fontSize: "18px" }
  };
  const { spinner, fontSize } = sizeMap[size];
  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    ...centered && {
      width: "100%",
      minHeight: "200px"
    }
  };
  return /* @__PURE__ */ jsxs("div", { style: containerStyle, children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        style: {
          width: spinner,
          height: spinner,
          border: `4px solid #f3f3f3`,
          borderTop: `4px solid #dd3333`,
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          marginBottom: "1rem"
        }
      }
    ),
    /* @__PURE__ */ jsx(
      "p",
      {
        style: {
          fontFamily: "Rubik, sans-serif",
          fontSize,
          color: "#363f48",
          margin: 0
        },
        children: message
      }
    ),
    /* @__PURE__ */ jsx("style", { children: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        ` })
  ] });
}

export { ContentLoader as C };
