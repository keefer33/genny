import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import { Audio } from "@remotion/media";

export function addTransitionSound<T extends Record<string, unknown>>(
  transition: TransitionPresentation<T>,
  src: string,
  volume = 1
): TransitionPresentation<T> {
  const { component: Component, ...other } = transition;
  const BaseComponent = Component as React.FC<TransitionPresentationComponentProps<T>>;

  const ComponentWithSound: React.FC<TransitionPresentationComponentProps<T>> = (props) => {
    return (
      <>
        {props.presentationDirection === "entering" ? <Audio src={src} volume={volume} /> : null}
        <BaseComponent {...props} />
      </>
    );
  };

  return {
    component: ComponentWithSound,
    ...other,
  };
}
