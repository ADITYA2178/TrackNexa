import BackgroundWrapper from '../../components/BackgroundWrapper'
import SignUp from './SignUp'

export default function SignUpPage() {
  return (
    <BackgroundWrapper
      contentClassName="w-full max-w-[400px]"
      paddingClassName="p-4 sm:p-6"
    >
      <SignUp />
    </BackgroundWrapper>
  )
}
