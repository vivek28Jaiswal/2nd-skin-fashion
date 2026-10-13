import blueTshirtImg from '../assets/imgs-transparent/blue-tshirt.png'
import blackSweatshirtImg from '../assets/imgs-transparent/black-swirt-shirt.png'
import centerTshirtImg from '../assets/imgs-transparent/center-thsirt.png'
import pantsJeansImg from '../assets/imgs-transparent/pants-jeans.png'
import blackHalfSleeveImg from '../assets/imgs-transparent/black-halfsleeve.png'

export const PRODUCTS = [
  {
    id: 'blue-tshirt',
    name: 'blue graffiti streetwear tee',
    img: blueTshirtImg,
    targetAngle: Math.PI * 0.45,
  },
  {
    id: 'black-sweatshirt',
    name: 'stüssy black classic crew',
    img: blackSweatshirtImg,
    targetAngle: Math.PI * 0.15,
  },
  {
    id: 'center-tshirt',
    name: 'lucky boxy-fit t-shirt',
    img: centerTshirtImg,
    targetAngle: -Math.PI * 0.25,
  },
  {
    id: 'pants-jeans',
    name: 'vintage wide-leg baggy denim',
    img: pantsJeansImg,
    targetAngle: -Math.PI * 0.70,
  },
  {
    id: 'black-halfsleeve',
    name: 'y-3 graphic half-sleeve',
    img: blackHalfSleeveImg,
    targetAngle: -Math.PI * 1.05,
  },
]
