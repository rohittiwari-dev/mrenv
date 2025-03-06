import {createEnv} from "./env";
import {z} from "zod";

const env = createEnv({
    publicPrefix:"PUBLIC_",
    schema:z.object({
        PORT: z.number(),
        RAJA: z.number(),
    })
})

console.log(env.RAJA)