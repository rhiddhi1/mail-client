import prisma from "@/lib/prisma";

export const POST = async (req: Request) => {
  const { data } = await req.json();

  const id = data.id;
  const email = data.email_addresses[0].email_address;
  const name = data.first_name;
  const imageURL = data.image_url;

  const newUser = await prisma.user.create({
    data: {
      id: id,
      email: email,
      name: name,
      imageURL: imageURL,
    },
  });
  return new Response("Webhook Received", { status: 200 });
};
