// Composite maps to the original plane and factored pullbacks, in the displayed charts.
// A polynomial is a list [coefficient, exponent of first variable, exponent of second].
export const CUSP_CHARTS=[
  {map:[[1,0],[0,1]],text:"x = x, y = y",factors:[[[1,0,2],[-1,3,0]]]},
  {map:[[1,0],[1,1]],text:"x = x, y = xt",factors:[[[1,2,0]],[[1,0,2],[-1,1,0]]]},
  {map:[[1,1],[2,1]],text:"x = ts, y = t²s",factors:[[[1,3,2]],[[1,1,0],[-1,0,1]]]},
  {map:[[2,1],[3,1]],text:"x = t²w, y = t³w",factors:[[[1,6,2]],[[1,0,0],[-1,0,1]]]},
];
export const CUSP_OTHER_FINAL={map:[[2,1],[3,2]],text:"x = s²v, y = s³v²",factors:[[[1,6,3]],[[1,0,1],[-1,0,0]]]};
export const HARD_CUSP_CHARTS=[
  {map:[[1,0],[0,1]],text:"x = x, y = y",factors:[[[1,0,2],[-1,5,0]]]},
  {map:[[1,0],[1,1]],text:"x = x, y = xt",factors:[[[1,2,0]],[[1,0,2],[-1,3,0]]]},
  {map:[[1,0],[2,1]],text:"x = x, y = x²u",factors:[[[1,4,0]],[[1,0,2],[-1,1,0]]]},
  {map:[[1,1],[3,2]],text:"x = us, y = u³s²",factors:[[[1,5,4]],[[1,1,0],[-1,0,1]]]},
  {map:[[2,1],[5,2]],text:"x = u²w, y = u⁵w²",factors:[[[1,10,4]],[[1,0,0],[-1,0,1]]]},
];
